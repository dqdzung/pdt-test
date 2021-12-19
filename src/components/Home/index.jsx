import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import ReactHTMLTableToExcel from "react-html-table-to-excel";

import "./Home.style.css";

const Home = () => {
	const [isLoading, setLoading] = useState(true);
	const [data, setData] = useState(null);
	const [total, setTotal] = useState();
	const [currentPage, setPage] = useState(1);
	const [offset, setOffset] = useState(0);
	const pageSize = 50;

	useEffect(() => {
		fetchData(currentPage);
	}, [currentPage]);

	const fetchData = async (page) => {
		setLoading(true);
		const res = await axios.post(
			`http://o-research-dev.orlab.com.vn/api/v1/filters/filter/?modelType=journals&filter={}&page=${page}&pageSize=${pageSize}&isPaginateDB=true&ignoreAssociation=true`
		);

		const totalDocs = res.data.metaData.total;
		const rows = res.data.data;
		const cols = [
			{ name: "Title", value: "title", hidden: false },
			{ name: "SJR", value: "sjr", hidden: false },
			{ name: "H index", value: "hIndex", hidden: false },
			{ name: "Total Docs", value: "totalDocs", hidden: false },
			{
				name: "Total Docs. (3years)",
				value: "totalDocsThreeYear",
				hidden: false,
			},
			{ name: "Total Refs", value: "totalRefs", hidden: false },
			{
				name: "Total Cites (3years)",
				value: "totalCitesThreeYear",
				hidden: false,
			},
			{
				name: "Citable Docs. (3years)",
				value: "citableDocsThreeYear",
				hidden: false,
			},
			{
				name: "Cites / Doc. (2years)",
				value: "citesDocTwoYear",
				hidden: false,
			},
			{ name: "Ref. / Doc.", value: "refDoc", hidden: false },
		];

		setPage(page);
		setOffset((page - 1) * pageSize + 1);
		setTotal(totalDocs);
		setData({ rows, cols });
		setLoading(false);
	};

	const handlePageChange = (e) => {
		if (e.target.id === "prev") {
			if (currentPage === 1) {
				return;
			}
			setPage(currentPage - 1);
			return;
		}
		if (currentPage === Math.ceil(total / pageSize)) {
			return;
		}
		setPage(currentPage + 1);
	};

	const useSortableData = (items, config = null) => {
		const [sortConfig, setSortConfig] = useState(config);

		const sortedItems = useMemo(() => {
			let sortableItems = [...items];
			if (sortConfig !== null) {
				sortableItems.sort((a, b) => {
					if (a[sortConfig.key] < b[sortConfig.key]) {
						return sortConfig.direction === "ascending" ? -1 : 1;
					}
					if (a[sortConfig.key] > b[sortConfig.key]) {
						return sortConfig.direction === "ascending" ? 1 : -1;
					}
					return 0;
				});
			}
			return sortableItems;
		}, [items, sortConfig]);

		const requestSort = (key) => {
			let direction = "descending";
			if (
				sortConfig &&
				sortConfig.key === key &&
				sortConfig.direction === "descending"
			) {
				direction = "ascending";
			}
			setSortConfig({ key, direction });
		};

		return { items: sortedItems, requestSort, sortConfig };
	};

	const Table = ({ data }) => {
		const [rows] = useState(data.rows);
		const [cols, setCols] = useState(data.cols);
		const [filter, setFilter] = useState({
			type: "",
			term: "",
		});

		const { items, requestSort, sortConfig } = useSortableData(rows);

		const getClassNamesFor = (field) => {
			if (!sortConfig) {
				return;
			}
			return sortConfig.key === field ? sortConfig.direction : undefined;
		};

		const handleDragStart = (e) => {
			const { id } = e.target;
			const idx = cols.findIndex((col) => col.value === id);
			e.dataTransfer.setData("colIdx", idx);
		};

		const handleDragOver = (e) => e.preventDefault();

		const handleOnDrop = (e) => {
			const { id } = e.target;

			const droppedColIdx = cols.findIndex((col) => col.value === id);

			const draggedColIdx = e.dataTransfer.getData("colIdx");
			const tempCols = [...cols];

			tempCols[draggedColIdx] = cols[droppedColIdx];
			tempCols[droppedColIdx] = cols[draggedColIdx];
			setCols(tempCols);
		};

		const toggleHidden = (index) => {
			let colsCopy = [...cols];

			colsCopy[index].hidden
				? (colsCopy[index].hidden = false)
				: (colsCopy[index].hidden = true);

			setCols(colsCopy);
		};

		const handleClickFilter = (colName) => {
			setFilter((prev) => ({
				...prev,
				type: colName,
			}));
		};

		const handleFilterInput = (e) => {
			if (filter.type) {
				setFilter((prev) => ({
					...prev,
					term: e.target.value,
				}));
			}
		};

		return (
			<>
				<ul className="d-flex my-3">
					{cols.map((col, index) => (
						<li key={col.value}>
							<button
								className="mx-1 btn btn-secondary"
								onClick={() => {
									toggleHidden(index);
								}}
							>
								{`${col.hidden ? "Show" : "Hide"} ${col.name}`}
							</button>
						</li>
					))}
				</ul>
				<div className="w-50 mb-3 input-group">
					<div className="input-group-prepend">
						<button
							className="btn btn-outline-secondary dropdown-toggle"
							type="button"
							data-toggle="dropdown"
							aria-haspopup="true"
							aria-expanded="false"
						>
							Filter
						</button>
						<div className="dropdown-menu">
							{cols.map((col) => (
								<button
									key={col.name}
									className="dropdown-item"
									onClick={() => {
										handleClickFilter(col.value);
									}}
								>
									{col.name}
								</button>
							))}
						</div>
					</div>
					<input
						type="text"
						className="form-control"
						onChange={handleFilterInput}
					/>
					<div className="mx-2 d-flex align-items-center">
						{filter.type && `by ${filter.type}`}
					</div>
				</div>
				<table className="my-0 mx-auto" id="data-table">
					<thead>
						<tr>
							{cols.map(
								(col, index) =>
									!col.hidden && (
										<th
											id={col.value}
											key={cols.indexOf(col)}
											onClick={() => {
												requestSort(col.value);
											}}
											className={`${getClassNamesFor(col.value)}`}
											draggable
											onDragStart={handleDragStart}
											onDragOver={handleDragOver}
											onDrop={handleOnDrop}
										>
											{col.name}
										</th>
									)
							)}
						</tr>
					</thead>
					<tbody>
						{items.map((item) => (
							<tr key={items.indexOf(item)}>
								{cols.map((col) => {
									if (filter.type && filter.term) {
										return (
											item[filter.type].toLowerCase().indexOf(filter.term) >
												-1 &&
											!col.hidden && <td key={col.name}>{item[col.value]}</td>
										);
									}
									return (
										!col.hidden && <td key={col.name}>{item[col.value]}</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</>
		);
	};

	const Pagination = ({ current, offset, total, onChange }) => {
		return (
			<div className="d-flex pagination align-items-center py-3">
				<button
					id="prev"
					className="btn btn-primary mx-1"
					onClick={onChange}
					disabled={isLoading}
				>
					Prev
				</button>
				<button
					id="next"
					className="btn btn-primary mx-1"
					onClick={onChange}
					disabled={isLoading}
				>
					Next
				</button>
				<div className="mx-2">
					{offset} - {pageSize * current > total ? total : pageSize * current}{" "}
					of {total}
				</div>
			</div>
		);
	};

	return (
		<div className="container App">
			<div className="d-flex align-items-center justify-content-center">
				<h1>Journal Rankings</h1>
				{isLoading && (
					<div
						className="spinner-border spinner-border-sm mx-2"
						role="status"
					/>
				)}
			</div>
			<div className="d-flex justify-content-between align-items-center">
				<Pagination
					current={currentPage}
					offset={offset}
					total={total}
					onChange={handlePageChange}
				/>
				<ReactHTMLTableToExcel
					id="export-button"
					className="btn btn-success"
					table="data-table"
					filename="journal-ranking"
					sheet="journal-ranking"
					buttonText="Export Data to Excel"
				/>
			</div>
			{!isLoading && <Table data={data} />}
			<Pagination
				current={currentPage}
				offset={offset}
				total={total}
				onChange={handlePageChange}
			/>
		</div>
	);
};

export default Home;
